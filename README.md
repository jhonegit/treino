# Treino

App que eu uso para registrar meus treinos de musculação, na hora, entre uma
série e outra. Agora com duas pessoas, cada uma com a sua ficha.

- Dois perfis no mesmo endereço. Os botões no alto da tela trocam de pessoa, e
  a cor da tela muda junto: laranja para um, rosa para o outro.
- Ficha, histórico, cargas, ajustes e treino em andamento são separados por
  pessoa. Trocar de perfil não mistura nada, e cada sessão fica esperando onde
  parou.
- Abre já no treino do dia: A, B ou C.
- Uma série se registra com um toque, com a carga da última vez já preenchida.
- Cronômetro de descanso, registro de desconforto e observação por exercício.
- Funciona sem internet. Tudo fica guardado no próprio aparelho, sem conta e
  sem nuvem, e dá para salvar um backup em arquivo (de uma pessoa ou das duas).

## As duas regras de progressão

Cada perfil usa a sua, e uma não interfere na outra.

- **Clássica.** Depois de duas sessões seguidas fechando o topo da faixa de
  repetições, com folga, o app sugere subir a carga. Tem também um atalho: uma
  sessão só com RIR 4 ou mais já indica que o peso está leve. E o contrário
  vale: se o último salto não pegou, ele sugere voltar para a carga anterior.
- **Cautelosa**, para quem está começando. Só sugere quando as duas execuções
  são comparáveis (mesmo aparelho, mesma unidade, mesmas séries e faixa), com a
  mesma carga, RIR 2 ou mais, execução marcada como boa e nenhum desconforto
  registrado. E só mostra um número depois que o passo daquele aparelho for
  informado: o app não chuta carga.

Nos dois casos quem decide sou eu. O app nunca muda carga nem série sozinho.

## Como rodar os testes

```
node teste.js
```

Testa a lógica fora do navegador, com um navegador de mentira que não tem
alert, confirm nem prompt: se o app tentar abrir um pop up, o teste quebra.
