const { z } = require("zod");

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: err.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });
    }
    next(err);
  }
};

const schemas = {
  discordPost: z.object({
    message: z.string().min(1, "Message is required"),
    postType: z.string().optional(),
  }),
  googleSave: z.object({
    message: z.string().min(1, "Message is required"),
  }),
  channelAdd: z.object({
    type: z.string().min(1, "Type is required"),
    url: z.string()
      .url("Invalid URL format")
      .regex(/^https:\/\/discord\.com\/channels\/\d+\/\d+$/, "Must be a valid Discord channel URL (https://discord.com/channels/GUILD_ID/CHANNEL_ID)"),
    name: z.string().optional(),
  }),
  channelRemove: z.object({
    type: z.string().min(1, "Type is required"),
    url: z.string().min(1, "URL is required"),
  }),
  channelToggle: z.object({
    url: z.string().min(1, "URL is required"),
  }),
};

module.exports = { validate, schemas };
