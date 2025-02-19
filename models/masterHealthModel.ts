import mongoose from "mongoose";

const parameterSchema = new mongoose.Schema({
  categories: { type: String, required: true },
  parameters: { type: Map, of: Number },
});
const MasterHealthSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tests: [parameterSchema],
    createdAt: { type: Date, default: Date.now },
    updateAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const MasterHealthModel = mongoose.model("MasterHealth", MasterHealthSchema);
export default MasterHealthModel;
