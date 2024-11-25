import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

export async function transactionsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (error) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  app.post('/transactions', async (request, reply) => {
    // Define o esquema de validação para o corpo da requisição
    const createTransactionBodySchema = z.object({
      title: z.string().min(1),
      amount: z.number().positive(),
      type: z.enum(['credit', 'debit'])
    })

    // Extrai os dados da transação do corpo da requisição e valida com o esquema
    const { title, amount, type } = createTransactionBodySchema.parse(request.body)

    // Cria um registro na tabela de transações do banco de dados
    await prisma.transaction.create({
      data: {
        userId: Number(request.user.sub),
        title,
        amount,
        type
      }
    })

    // Retorna uma resposta com o código 201 (created)
    return reply.status(201).send()
  })

  app.get('/transactions', async (request, reply) => {
    // Define o esquema de validação para os parâmetros de consulta (query params)
    const searchTransactionsQuerySchema = z.object({
      order: z.enum(['asc', 'desc']).default('desc'),
      title: z.string().optional(),
      type: z.enum(['credit', 'debit']).optional(),
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(10).max(50).default(10)
    })

    // Extrai os parâmetros de busca da requisição e valida com o esquema
    const { order, title, type, page, limit } = searchTransactionsQuerySchema.parse(request.query)

    // Busca as transações no banco de dados com base nos filtros especificados
    const transactions = await prisma.transaction.findMany({
      orderBy: {
        id: order // Ordena as transações por id em ordem decrescente
      },
      take: limit, // Limita o número de transações retornadas
      skip: (page - 1) * limit, // Pula as transações das páginas anteriores
      where: {
        userId: Number(request.user.sub),
        type, // Filtra as transações pelo tipo (crédito ou débito)
        title: {
          contains: title // Filtra as transações pelo título
        }
      }
    })

    // Conta o total de transações no banco de dados com base nos filtros especificados
    const totalTransactions = await prisma.transaction.count({
      where: {
        userId: Number(request.user.sub),
        type, // Filtra as transações pelo tipo (crédito ou débito)
        title: {
          contains: title // Filtra as transações pelo título
        }
      }
    })

    // Retorna o array de transações dentro de um objeto como resposta, além de metadados sobre a paginação
    return reply.send({
      transactions,
      page, // Número da página atual
      limit, // Número de transações por página
      totalPages: Math.ceil(totalTransactions / limit), // Número total de páginas
    })
  })

  app.get('/transactions/:id', async (request, reply) => {
    // Define o esquema de validação para o corpo da requisição
    const getTransactionParamsSchema = z.object({
      id: z.coerce.number()
    })

    // Extrai os dados da transação dos parâmetros da requisição e valida com o esquema
    const { id } = getTransactionParamsSchema.parse(request.params)

    // Busca a transação pelo id
    const transaction = await prisma.transaction.findUnique({
      where: {
        userId: Number(request.user.sub),
        id
      }
    })

    // Se a transação não for encontrada, retorna um erro 404
    if (!transaction) {
      return reply.status(404).send({ error: 'Transaction not found' })
    }

    // Retorna a transação encontrada
    return reply.send({ transaction })
  })

  app.put('/transactions/:id', async (request, reply) => {
    // Define o esquema de validação para os parâmetros da rota
    const updateTransactionParamsSchema = z.object({
      id: z.coerce.number()
    })

    // Define o esquema de validação para o corpo da requisição
    const updateTransactionBodySchema = z.object({
      title: z.string().min(1),
      amount: z.number().positive(),
      type: z.enum(['credit', 'debit'])
    })

    // Extrai o id da transação dos parâmetros da rota da requisição e valida com o esquema
    const { id } = updateTransactionParamsSchema.parse(request.params)

    // Extrai os dados da transação do corpo da requisição e valida com o esquema
    const { title, amount, type } = updateTransactionBodySchema.parse(request.body)

    // Busca a transação pelo id
    const transaction = await prisma.transaction.findUnique({
      where: {
        userId: Number(request.user.sub),
        id
      }
    })

    // Se a transação não for encontrada, retorna um erro 404
    if (!transaction) {
      return reply.status(404).send({ error: 'Transaction not found' })
    }

    // Atualiza a transação no banco de dados
    await prisma.transaction.update({
      where: {
        userId: Number(request.user.sub),
        id,
      },
      data: {
        title,
        amount,
        type
      },
    })

    // Retorna uma resposta com o código 200 (OK)
    return reply.send()
  })

  app.delete('/transactions/:id', async (request, reply) => {
    // Define o esquema de validação para o corpo da requisição
    const deleteTransactionParamsSchema = z.object({
      id: z.coerce.number()
    })

    // Extrai os dados da transação dos parâmetros da requisição e valida com o esquema
    const { id } = deleteTransactionParamsSchema.parse(request.params)

    // Deleta a transação do banco de dados
    const transaction = await prisma.transaction.delete({
      where: {
        userId: Number(request.user.sub),
        id
      }
    })

    // Se a transação não for encontrada, retorna um erro 404
    if (!transaction) {
      return reply.status(404).send({ error: 'Transaction not found' })
    }

    // Retorna uma resposta de sucesso
    return reply.status(204).send() // Status 204 indica que a operação foi bem-sucedida sem conteúdo de retorno
  })

  app.get('/transactions/summary', async (request, reply) => {
    // Busca a soma de todas as transações de crédito
    let aggregations = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        userId: Number(request.user.sub),
        type: 'credit'
      },
    })

    const totalCredit = aggregations._sum.amount ?? 0

    // Busca a soma de todas as transações de débito
    aggregations = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        userId: Number(request.user.sub),
        type: 'debit'
      },
    })

    const totalDebit = aggregations._sum.amount ?? 0

    // Retorna o resumo das transações
    return reply.send({
      summary: {
        totalCredit,
        totalDebit,
        netBalance: totalCredit - totalDebit
      }
    })
  })
}