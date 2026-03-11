const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = async function (fastify) {
  fastify.post(
    "/",
    { preHandler: [fastify.authenticate] },
    async function (req, res) {
      try {
        const { courseName, beginDate, paymentMethod } = req.body;
        const [day, month, year] = beginDate.split(".");
        const formattedDate = new Date(`${day}-${month}-${year}`);

        const application = await prisma.application.create({
          data: {
            userId: req.user.id,
            courseName,
            beginDate: formattedDate,
            paymentMethod,
            status: "NEW",
          },
        });
        res.status(200).send(application);
      } catch (error) {
        res.status(500).send({ error: error });
      }
    },
  );
  fastify.get(
    "/",
    { preHandler: [fastify.authenticate] },
    async function (req, res) {
      try {
        switch (req.user.role) {
          case "ADMIN":
            const adminapps = await prisma.application.findMany();
            res.status(200).send(adminapps);
            break;
          case "USER":
            const userapps = await prisma.application.findMany({
              where: { userId: req.user.id },
            });
            res.status(200).send(userapps);
            break;
        }
      } catch (e) {
        res.status(500).send({ error: e });
      }
    },
  );
  fastify.patch(
    "/:id",
    { preHandler: [fastify.authenticate] },
    async (req, res) => {
      try {
        const app = await prisma.application.update({
          where: { id: Number(req.params.id) },
          data: { status: req.body.status },
        });
        res.send(app);
      } catch (e) {
        res.status(500).send(e);
      }
    },
  );
};
