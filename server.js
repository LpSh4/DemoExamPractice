const fastify = require("fastify")({ logger: true });
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Register JWT for authentication
fastify.register(require("@fastify/jwt"), {
  secret: "supersecret", // In production, use env variable
  logger: true,
});

// Helper: Check if Admin
fastify.decorate("authenticate", async (request, reply) => {
  try {
    const decoded = await request.jwtVerify(); // verify the JWT
    request.user = decoded; // attach payload for routes
  } catch (err) {
    reply.code(401).send({ error: "Unauthorized" });
  }
});

fastify.register(require("./routes/application"), { prefix: "/applications" });
fastify.register(require("./routes/user"), { prefix: "/users" });
fastify.register(require("./routes/review"), { prefix: "/reviews" });

fastify.listen({ port: 3001 }, (err) => {
  if (err) throw err;
  console.log("Server running at http://localhost:3000");
});
