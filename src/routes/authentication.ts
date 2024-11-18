import { FastifyInstance } from "fastify";
import z from "zod";
import { prisma } from "../lib/prisma";
import { hash } from 'bcryptjs'

export async function authenticationRoutes(app: FastifyInstance){
    app.post('/auth/register', async (request, reply) => {
        const registerUserBodySchema = z.object({
            name: z.string().min(3),
            email: z.string().email(),
            password: z.string().min(6)
        })

        const { name, email, password } = registerUserBodySchema.parse(request.body)

        const userWithSameEmail = await prisma.user.findUnique({
            where: {
                email
            }
        })

        if (userWithSameEmail) {
            return reply.status(409).send({ error: 'User already exists' })
        }

        const passwordHash = await hash(password, 8)

        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash
            }
        })

        return reply.status(201).send()
    })
}