# Fotos de celular e atalhos de transporte

## Formatos e fluxo

Seleção de fotos identifica o conteúdo em vez de rejeitar arquivos por MIME ausente/incorreto. O navegador rasteriza formatos que consegue abrir. Se isso falhar, `POST /api/media/normalize` recebe multipart autenticado (campo `photo`) e converte temporariamente para JPEG, sem criar MediaAsset ou salvar o original.

Suporte validado com arquivos reais: JPEG, PNG, WebP, GIF (primeiro quadro), AVIF, TIFF e HEIC. BMP e SVG funcionam quando decodificados pelo navegador. Arquivos corrompidos, formatos sem decodificador e arquivos maiores que 25 MB recebem orientação; não existe garantia para todo formato proprietário/RAW. O usuário pode tirar outra foto pela câmera integrada.

Conversão em worker isolado com tempo máximo de 30 segundos, limite de 96 milhões de pixels e uma conversão simultânea. A saída tem no máximo 1600 pixels no maior lado, JPEG qualidade 85, orientação corrigida quando há EXIF e metadados removidos. Não há recorte automático no conversor. Arquivos animados tornam-se fotos estáticas. O frontend indica preparação e desabilita envio até a prévia ficar pronta; o editor continua disponível antes de publicar.

`POST /api/media` mantém o limite de 5 MB para a imagem final. Clientes antigos que enviam conteúdo convertível com MIME incompatível também recebem conversão de reserva. As demais validações de arquivo e autenticação permanecem.

A política DEMO v2 informa o envio temporário para conversão antes de publicar. Os dados empresariais seguem fictícios; as informações públicas do bar não alteram a identidade jurídica da minuta.

## VPS / Nginx

Os templates `deploy/pirambeira-https.conf` e `deploy/pirambeira-http.conf` incluem uma localização específica para `/api/media/normalize`, com 26 MB para o multipart e timeout de 45 segundos. O restante da API mantém os limites anteriores. Na VPS atual: `/etc/nginx/sites-available/pirambeira.conf`.

```bash
ssh root@153.75.244.238
/usr/local/sbin/pirambeira-update
nginx -t
systemctl reload nginx
systemctl status pirambeira-api pirambeira-web --no-pager
curl -fsS https://pirambeira.genioplay.com.br/api/health
```

Não substituir um arquivo TLS personalizado sem revisar certificados e outras configurações. Para novas instalações, usar o template HTTPS e os caminhos descritos em `ATUALIZACAO-VPS.md`. A entrega inicial aplicou a localização específica na configuração existente e validou com `nginx -t`.

## Testes

`pnpm --filter backend test` cobre formatos, dimensões, rotação e rejeição de arquivos corrompidos. Para executar também o teste de HEIC real, baixar a amostra oficial upstream em ambiente de validação:

```bash
cd /opt/pirambeira/repository/backend
mkdir -p test/fixtures
curl -fL https://raw.githubusercontent.com/strukturag/libheif/master/examples/example.heic -o test/fixtures/phone.heic
PATH=/opt/pirambeira/runtime/bin:/usr/bin:/bin pnpm test
```

A amostra é opcional e não é incluída no repositório; sem ela apenas esse teste é omitido. A validação desta entrega executou esse teste com o arquivo real. Não usar imagem particular de usuário como fixture pública.

## Transporte no menu Mais

SVG Uber: ícone de Simple Icons (CC0), origem `https://github.com/simple-icons/simple-icons/blob/develop/icons/uber.svg`. Identificação 99 em SVG tipográfico amarelo/preto. Uso identifica os serviços; não representa parceria.

Uber usa universal link com endereço público e nome do estabelecimento, sem ler a localização do usuário na aplicação. Destino deve ser conferido no app. 99 usa o link oficial `https://99.onelink.me/Mayr`; copiar endereço está disponível porque não foi encontrado um parâmetro oficial público para destino. A viagem é confirmada no serviço de transporte, sem pedido automático, cobrança, estimativa de preço ou tempo de chegada inventada.

Referências: [Uber](https://developer.uber.com/docs/riders/ride-requests/tutorials/deep-links/faq), [99](https://99app.com/passageiro/baixe-o-app-da-99/).
