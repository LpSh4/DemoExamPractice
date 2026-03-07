const fastify = require('fastify')({ logger: true });
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Register JWT for authentication
fastify.register(require('@fastify/jwt'), {
    secret: 'supersecret', // In production, use env variable
    logger: true
});

// Helper: Check if Admin
fastify.decorate("authenticate", async (request, reply) => {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.send(err);
    }
});

// --- USER ROUTES ---

// POST /user - Registration
fastify.post('/user', async (request, reply) => {
    const { login, password, name, surname, middleName, phone, email } = request.body;

    // Validation
    const loginRegex = /^[a-zA-Z0-9]{6,}$/;
    const cyrillicRegex = /^[a-zA-Z0-9]{6,}$/;
    const phoneRegex = /^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/;

    if (!loginRegex.test(login)) return reply.code(400).send({ error: "Login must be 6+ alphanumeric chars" });
    if (password.length < 8) return reply.code(400).send({ error: "Password must be 8+ chars" });
    // if (!cyrillicRegex.test(name) || !cyrillicRegex.test(surname)) {
    //     return reply.code(400).send({ error: "FIO must be in Cyrillic" });
    // }
    // if (!phoneRegex.test(phone)) return reply.code(400).send({ error: "Format: 8(XXX)XXX-XX-XX" });

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.create({
            data: {
                login,
                password: hashedPassword,
                name,
                surname,
                middleName,
                phone,
                email,
                role: login === 'Admin' ? 'ADMIN' : 'USER' // Auto-assign Admin based on requirement
            }
        });
        return { status: 'User created', userId: user.id };
    } catch (e) {
        return reply.code(400).send({ error: "Login or Email already exists" });
    }
});

// GET /user - Login
fastify.post('/login', async (request, reply) => {
    const { login, password } = request.body;
    const user = await prisma.user.findUnique({ where: { login } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return reply.code(401).send({ error: "Incorrect login or password" });
    }

    const token = fastify.jwt.sign({ id: user.id, role: user.role });
    return { token };
});

// DELETE /user (Admin only)
fastify.delete('/user/:email', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') return reply.code(403).send({ error: "Forbidden" });

    await prisma.user.delete({ where: { email: request.params.email } });
    return { status: "User deleted" };
});

// --- APPLICATION ROUTES ---

// POST /application
fastify.post('/application', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { courseName, beginDate, paymentMethod } = request.body;
    // Parse date from DD.MM.YYYY
    const [day, month, year] = beginDate.split('.');
    const formattedDate = new Date(`${year}-${month}-${day}`);

    const app = await prisma.application.create({
        data: {
            userId: request.user.id,
            courseName,
            beginDate: formattedDate,
            paymentMethod, // EXPECTS 'CASH' or 'TRANSFER'
            status: 'NEW'
        }
    });
    return app;
});

// GET /application (User's own or all for Admin)
fastify.get('/application', { preHandler: [fastify.authenticate] }, async (request) => {
    if (request.user.role === 'ADMIN') {
        return await prisma.application.findMany({ include: { user: true } });
    }
    return await prisma.application.findMany({ where: { userId: request.user.id } });
});

// PUT /application (Admin Change Status)
fastify.put('/application/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') return reply.code(403).send({ error: "Forbidden" });

    const { status } = request.body; // NEW, IN_PROGRESS, COMPLETED
    return await prisma.application.update({
        where: { id: parseInt(request.params.id) },
        data: { status }
    });
});

// --- REVIEW ROUTES ---

// POST /review
fastify.post('/review', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { applicationId, content, rating } = request.body;

    const app = await prisma.application.findUnique({ where: { id: applicationId } });

    if (!app || app.userId !== request.user.id) return reply.code(404).send({ error: "App not found" });
    if (app.status !== 'COMPLETED') {
        return reply.code(400).send({ error: "Review only allowed after 'Обучение завершено'" });
    }

    return await prisma.review.create({
        data: { applicationId, content, rating: parseInt(rating) }
    });
});

// GET /review
fastify.get('/review', async () => {
    return await prisma.review.findMany({ include: { application: true } });
});

// Start Server
fastify.listen({ port: 3000 }, (err) => {
    if (err) throw err;
    console.log('Server running at http://localhost:3000');
});