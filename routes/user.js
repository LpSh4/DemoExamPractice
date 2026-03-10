const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

module.exports = async function (fastify) {
  fastify.post("/", async (req, res) => {
    const { login, password, name, middleName, surname, phone, email } =
      req.body;

    try {
      const user = await prisma.user.create({
        data: {
          login,
          password: await bcrypt.hash(password, 10),
          name,
          middleName,
          surname,
          phone,
          email,
        },
      });
      res.status(200).send(user);
    } catch (error) {
      res.status(401).send({ error: error.message });
      console.log(error);
    }
  });

  fastify.post("/login", async (req, res) => {
    const { login, password } = req.body;
    const user = await prisma.user.findUnique({ where: { login } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.code(401).send({ error: "Incorrect login or password" });
    }

    return res.status(200).send({ message: "Logged in" });
  });
};
