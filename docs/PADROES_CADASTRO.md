# PharmaControl - Padroes de Cadastro

## Clientes

| Campo | Obrigatorio | Formato | Exemplo | Notas |
|-------|-------------|---------|---------|-------|
| Nome completo | Sim | Texto livre | `Maria Silva Santos` | Min. 2 caracteres |
| CPF | Nao | 11 digitos (com ou sem formatacao) | `123.456.789-09` ou `12345678909` | Validado matematicamente (digitos verificadores). Use CPFs validos para teste |
| Data Nascimento | Nao | AAAA-MM-DD (seletor de data) | `1999-06-17` | O campo `type="date"` do formulario ja envia nesse formato |
| Genero | Nao | Selecao | `masculino`, `feminino`, `outro`, `prefiro_nao_dizer` | |
| Telefone | Nao | Texto livre | `(15) 99798-2554` ou `15997982554` | Aceita qualquer formato |
| WhatsApp | Nao | Texto livre | `(15) 99798-2554` ou `15997982554` | Mesmo padrao do telefone |
| E-mail | Nao | E-mail valido | `cliente@email.com` | |
| Medico Prescritor | Nao | Texto livre | `Dr. Braulio Mendes` | |
| Notas Clinicas | Nao | Texto livre (textarea) | `Alergia a dipirona` | |

### CPFs Validos para Teste

Como o sistema valida os digitos verificadores do CPF, use um destes para teste:

| CPF | Formatado |
|-----|-----------|
| `52998224725` | `529.982.247-25` |
| `11144477735` | `111.444.777-35` |
| `71750702000` | `717.507.020-00` |
| `38440034098` | `384.400.340-98` |
| `50033315044` | `500.333.150-44` |

> **Nota:** Estes sao CPFs matematicamente validos para teste, nao pertencem a pessoas reais.

---

## Produtos / Insumos

| Campo | Obrigatorio | Formato | Exemplo |
|-------|-------------|---------|---------|
| Nome | Sim | Texto livre | `Vitamina C 500mg` |
| Principio Ativo | Nao | Texto livre | `Acido Ascorbico` |
| Codigo | Nao | Texto livre | `VIT-C-500` |
| Codigo de Barras | Nao | Texto livre | `7891234567890` |
| Categoria | Sim | Selecao | `raw_material`, `compound_formula`, `finished_product`, `packaging`, `other` |
| Unidade de Medida | Sim | Texto livre | `mg`, `ml`, `g`, `kg`, `un`, `cap` |
| Estoque Minimo | Nao | Numero decimal | `100` ou `50.5` |
| Estoque Maximo | Nao | Numero decimal | `1000` |
| Ciclo de Recompra (dias) | Nao | Numero inteiro | `30`, `60`, `90` |
| Custo Unitario | Nao | Numero decimal (R$) | `15.50` |
| Preco Unitario | Nao | Numero decimal (R$) | `25.90` |
| Controlado | Nao | Sim/Nao | `false` |
| Exige Receita | Nao | Sim/Nao | `false` |
| Codigo ANVISA | Nao | Texto livre | `1.0573.0123.001-1` |

### Categorias

| Valor | Descricao |
|-------|-----------|
| `raw_material` | Materia-prima / Insumo |
| `compound_formula` | Formula manipulada |
| `finished_product` | Produto pronto |
| `packaging` | Embalagem |
| `other` | Outro |

---

## Pedidos

| Campo | Obrigatorio | Formato | Exemplo |
|-------|-------------|---------|---------|
| Cliente | Sim | Selecao (busca) | Selecionar cliente cadastrado |
| Itens | Sim (min. 1) | Lista de produtos | Produto + Quantidade + Preco |
| Medico Prescritor | Nao | Texto livre | `Dr. Braulio` |
| Numero da Receita | Nao | Texto livre | `REC-2026-001` |
| Data Estimada de Entrega | Nao | AAAA-MM-DD | `2026-04-15` |
| Desconto | Nao | Numero decimal (R$) | `10.00` |
| Forma de Pagamento | Nao | Texto livre | `PIX`, `Cartao`, `Dinheiro` |
| Observacoes | Nao | Texto livre | `Entregar pela manha` |

### Status do Pedido (automatico)

| Status | Descricao | Transicoes Permitidas |
|--------|-----------|----------------------|
| `received` | Recebido | → `in_preparation`, `cancelled` |
| `in_preparation` | Em Manipulacao | → `ready`, `cancelled` |
| `ready` | Pronto | → `delivered`, `cancelled` |
| `delivered` | Entregue | (final) |
| `cancelled` | Cancelado | (final) |

---

## Estoque - Movimentacoes

| Campo | Obrigatorio | Formato | Exemplo |
|-------|-------------|---------|---------|
| Tipo | Sim | Selecao | `entry`, `exit`, `adjustment`, `loss`, `expiration` |
| Quantidade | Sim | Numero decimal positivo | `100.5` |
| Custo Unitario | Nao | Numero decimal (R$) | `12.50` |
| Motivo | Nao | Texto livre | `Compra fornecedor X` |
| Documento de Referencia | Nao | Texto livre | `NF-12345` |

### Tipos de Movimentacao

| Tipo | Descricao | Efeito no Estoque |
|------|-----------|-------------------|
| `entry` | Entrada | + quantidade |
| `exit` | Saida | - quantidade |
| `adjustment` | Ajuste/Inventario | Define quantidade exata |
| `loss` | Perda | - quantidade |
| `expiration` | Vencimento | - quantidade |

---

## Lembretes de Recompra

| Campo | Obrigatorio | Formato | Exemplo |
|-------|-------------|---------|---------|
| Cliente | Sim | Selecao | Cliente cadastrado |
| Produto | Nao | Selecao | Produto cadastrado |
| Data Agendada | Sim | AAAA-MM-DD (futuro) | `2026-05-01` |
| Canal | Sim | Selecao | `whatsapp`, `email`, `push` |
| Mensagem Customizada | Nao | Texto livre | Sobrescreve o template padrao |

### Status do Lembrete

| Status | Descricao |
|--------|-----------|
| `scheduled` | Agendado (aguardando envio) |
| `sent` | Enviado |
| `viewed` | Visualizado pelo cliente |
| `converted` | Cliente fez nova compra |
| `ignored` | Cliente nao respondeu |
| `cancelled` | Cancelado manualmente |

---

## Dicas Gerais

- **Datas:** O sistema usa o formato ISO `AAAA-MM-DD` internamente. Os campos de data do formulario ja convertem automaticamente.
- **CPF:** Pode digitar com ou sem pontos/traco. O sistema limpa e valida. Use CPFs validos para teste (listados acima).
- **Telefone:** Formato livre. Recomendado: `(DDD) XXXXX-XXXX`.
- **Valores monetarios:** Use ponto como separador decimal: `25.90` (nao `25,90`).
- **Campos opcionais:** Podem ser deixados em branco sem problemas.
