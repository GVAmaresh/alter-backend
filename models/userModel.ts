import mongoose, { Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";

interface IUserSchema {
  email: string;
  emailVerified: boolean;
  userName: string;
  emergencyContact: number;
  emergencyName: string;
  gender: string;
  dob: Date;
  createdAt: Date;
  idType: string;
  idNumber: number;
  nameCard: string;
  namePhysician: string;
  pincode: number;
  state: string;
  password: string;
  confirmPassword: string;
}

const UserSchema: Schema<IUserSchema> = new Schema({
  email: { type: String, required: [true, "Email is required"] },
  emailVerified: { type: Boolean, default: false },
  userName: { type: String },
  emergencyContact: { type: Number },
  emergencyName: { type: String },
  gender: { type: String, enum: ["male", "female", "other"] },
  dob: { type: Date },
  createdAt: { type: Date, default: Date.now },
  idType: { type: String },
  idNumber: { type: Number },
  nameCard: { type: String },
  namePhysician: { type: String },
  pincode: { type: Number },
  state: { type: String },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (el) {
        return el == this.password;
      },
      message: "Passwords are not the same!",
    },
  },
});

UserSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) {
      next();
    }
    this.password = await bcrypt.hash(this.password, 12);
    this.confirmPassword = undefined;
    next();
  } catch (err: any) {
    next(err);
  }
});

UserSchema.methods.correctPassword = async function ({
  databasePassword,
  userPassword,
}: {
  userPassword: string;
  databasePassword: string;
}) {
  return await bcrypt.compare(databasePassword, userPassword);
};

const UserModel: Model<IUserSchema> = mongoose.model<IUserSchema>(
  "User",
  UserSchema
);

export default UserModel;
