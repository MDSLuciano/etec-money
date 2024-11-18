import fastify from 'fastify'
import { transactionsRoutes } from './routes/transactions'
import { ZodError } from 'zod'
import { fromZodError } from 'zod-validation-error'
import cors from "@fastify/cors"
import { authenticationRoutes } from './routes/authentication'

const app = fastify()

app.register(cors, {
  origin: "*",
})


app.register(transactionsRoutes)
app.register(authenticationRoutes)

app.setErrorHandler((error, _, reply) => {
  if (error instanceof ZodError) {
    return reply
      .status(400)
      .send({ message: 'Validation error.', issues: fromZodError(error) })
  }

  console.error(error)

  return reply.status(500).send({ message: 'Internal server error.' })
})

app.listen({ port: 3333 }).then(() => {
	console.log('HTTP server running!')
  console.log("http://localhost:3333");
})