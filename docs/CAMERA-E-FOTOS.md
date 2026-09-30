# Câmera e ajuste de fotos

Publicar e De Agora usam a mesma câmera em tela cheia, na camada modal nativa do navegador. O menu inferior e o header não cobrem os controles. A câmera solicita acesso, permite alternar entre frontal e traseira, selecionar da galeria ou usar a câmera nativa do celular.

Depois de tirar ou escolher a foto, ajuste o enquadramento: arraste a imagem, controle o zoom, mantenha a foto inteira ou preencha o quadro. Confirme em **Usar esta foto**. Cancelar o ajuste mantém a foto anterior.

No perfil, a prévia circular mostra o que ficará visível no avatar. Nos campos de imagem do painel, o ajuste ocorre antes do upload. Fotos grandes são redimensionadas e convertidas para JPEG, mantendo a imagem enviada dentro do limite da API.

O feed limita a altura das imagens e usa contain para preservar o enquadramento escolhido. Imagens antigas já recortadas no arquivo não podem recuperar partes perdidas; escolha o original novamente para reenquadrá-las.

A captura mantém a imagem completa da câmera para permitir o ajuste posterior. Streams são encerrados ao fechar, capturar ou alternar a câmera, inclusive se a permissão terminar de carregar depois do fechamento.

Validação: build de produção na VPS e testes no Chrome com câmera simulada em viewport mobile de 390×844. Verificados captura, troca de câmera, modal acima do menu, enquadramento e zoom, avatar quadrado, upload/payload de posts e stories com API simulada, permissão negada e fechamento durante permissão pendente. O hardware e as permissões do Safari/iPhone precisam de confirmação no aparelho.

Publicação na VPS segue [ATUALIZACAO-VPS.md](ATUALIZACAO-VPS.md).
