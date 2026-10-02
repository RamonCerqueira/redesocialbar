#!/bin/bash
set -Eeuo pipefail
umask 0027
exec 9>/opt/pirambeira/shared/update.lock
flock -n 9 || { echo 'Outra atualizacao esta em andamento.'; exit 1; }
root=/opt/pirambeira
repo=$root/repository
old=$(readlink -f "$root/current")
export PATH="$root/runtime/bin:/usr/local/sbin:/usr/sbin:/usr/bin:/bin"
cd "$repo"
runuser -u pirambeira -- git pull --ff-only origin main
commit=$(runuser -u pirambeira -- git rev-parse HEAD)
release="$root/releases/$(date -u +%Y%m%d-%H%M%S)-${commit:0:8}"
mkdir "$release"
runuser -u pirambeira -- git archive "$commit" backend frontend package.json pnpm-lock.yaml pnpm-workspace.yaml deploy docs README.md | tar -x -C "$release"
if ! cmp -s "$release/backend/prisma/schema.prisma" "$old/backend/prisma/schema.prisma" || ! diff -qr "$release/backend/prisma/migrations" "$old/backend/prisma/migrations"; then
  schema_hash=$(sha256sum "$release/backend/prisma/schema.prisma" | cut -d ' ' -f1)
  if [ ! -f "$root/shared/approved-schema" ] || [ "$(cat "$root/shared/approved-schema")" != "$commit $schema_hash" ]; then
    echo 'Mudancas no banco detectadas. Prepare e verifique as migracoes e o backup antes de aprovar este commit.'
    exit 1
  fi
  echo 'Migracao previamente verificada para este commit.' 
fi
ln -s "$root/shared/backend.env" "$release/backend/.env"
ln -s "$root/shared/frontend.env" "$release/frontend/.env.production"
printf '%s\n' "$commit" > "$release/REVISION"
chown -R pirambeira:pirambeira "$release"
cd "$release"
runuser -u pirambeira -- env PATH="$PATH" pnpm install --frozen-lockfile
runuser -u pirambeira -- env PATH="$PATH" NODE_OPTIONS=--max-old-space-size=1536 pnpm --filter backend build
runuser -u pirambeira -- env PATH="$PATH" pnpm --filter backend test
runuser -u pirambeira -- env PATH="$PATH" NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=1536 pnpm --filter frontend build
rollback() {
  ln -sfn "$old" "$root/current.rollback"
  mv -Tf "$root/current.rollback" "$root/current"
  systemctl restart pirambeira-api pirambeira-web
  echo "Versao anterior restaurada: $old"
}
ln -sfn "$release" "$root/current.next"
mv -Tf "$root/current.next" "$root/current"
trap 'rollback' ERR
systemctl restart pirambeira-api pirambeira-web
healthy=0
for attempt in {1..30}; do
  if curl -fsS --max-time 3 http://127.0.0.1:3211/api/health >/dev/null && curl -fsS --max-time 3 http://127.0.0.1:3210/ >/dev/null; then healthy=1; break; fi
  sleep 2
done
if [ "$healthy" -ne 1 ]; then false; fi
curl -fsS --max-time 15 https://pirambeira.genioplay.com.br/ >/dev/null
curl -fsS --max-time 15 https://pirambeira.genioplay.com.br/api/health >/dev/null
trap - ERR
printf '%s\n' "$old" > "$root/shared/previous-release"
rm -f "$root/shared/approved-schema"
echo "ATUALIZACAO CONCLUIDA: $commit"
