const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = async function (fastify) {
  fastify.post(
    "/",
    { preHandler: [fastify.authenticate] },
    async function (req, res) {
      const { applicationId, content, rating } = req.body;
      try {
        const app = await prisma.application.findUnique({
          where: { id: applicationId },
        });

        if (!app || app.userId !== req.user.id) {
          return res
            .status(401)
            .send({ message: "Application is unavailable/not found" });
        }

        if (app.status !== "COMPLETED") {
          return res.status(400).send({
            message:
              "Reviews are only allowed after the completion of the course",
          });
        }

        const review = await prisma.review.create({
          data: {
            applicationId,
            content,
            rating,
          },
        });
        res.status(200).send(review);
      } catch (e) {
        res.status(500).send({ error: e });
      }
    },
  );
};
