import { Request, Response } from "express";
import UserModel from "../models/userModel";

// export const updateUserDetails = async (req: Request, res: Response) => {
//   try {
//     const {
//       userName,
//       emergencyContact,
//       emergencyName,
//       gender,
//       dob,
//       age,
//       idType,
//       idNumber,
//       nameCard,
//       namePhysician,
//       pincode,
//       state,
//     } = req.body;

//     if (Object.keys(req.body).length === 0) {
//       return res.status(400).json({ message: "Request body cannot be empty" });
//     }

//     if (
//       !userName ||
//       !emergencyContact ||
//       !emergencyName ||
//       !gender ||
//       !dob ||
//       !age ||
//       !idType ||
//       !idNumber ||
//       !nameCard ||
//       !namePhysician ||
//       !pincode ||
//       !state
//     ) {
//       return res.status(422).json({ message: "Incomplete Fields" });
//     }

//     const user = res.locals.user;
//     const existingUser = await UserModel.findById(user._id);
//     if (!existingUser) {
//       return res.status(404).json({
//         message: "User not found in database",
//         isValid: false,
//         verifyEmail: true,
//         isCompleteUserDetails: false,
//       });
//     }
//     if (!user.emailVerified) {
//       res
//         .status(200)
//         .json({
//           message: "Email not verified",
//           isValid: false,
//           verifyEmail: false,
//           isCompleteUserDetails: false,
//         });
//     }
//     const updatedUser = await UserModel.findByIdAndUpdate(
//       user._id,
//       {
//         userName,
//         emergencyContact,
//         emergencyName,
//         gender,
//         dob,
//         age,
//         idType,
//         idNumber,
//         nameCard,
//         namePhysician,
//         pincode,
//         state,
//       },
//       { new: true, runValidators: true }
//     );

//     if (!updatedUser) {
//       return res.status(404).json({ message: "User not found",       isValid: false,
//         verifyEmail: true,
//         isCompleteUserDetails: false, });
//     }

//     res.status(200).json({
//       message: "User details updated successfully",
//       updatedUser,
//       user,
//       isValid: true,
//       verifyEmail: true,
//       isCompleteUserDetails: true,
//     });
//   } catch (err: any) {
//     console.error("Error updating user details:", err);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };




export const updateUserDetails = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    if (!user) {
      return res.status(401).json({ message: "Token validation failed" });
    }

    const existingUser = await UserModel.findById(user._id);
    if (!existingUser) {
      return res.status(404).json({
        message: "User not found in database",
        isValid: false,
        verifyEmail: true,
        isCompleteUserDetails: false,
      });
    }

    if (!user.emailVerified) {
      return res.status(200).json({
        message: "Email not verified",
        isValid: false,
        verifyEmail: false,
        isCompleteUserDetails: false,
      });
    }

    const updateFields: Partial<typeof req.body> = {};
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) {
        updateFields[key] = req.body[key];
      }
    });

    if (updateFields.dob) {
      updateFields.dob = new Date(updateFields.dob);
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
        isValid: false,
        verifyEmail: true,
        isCompleteUserDetails: false,
      });
    }

    res.status(200).json({
      message: "User details updated successfully",
      updatedUser,
      isValid: true,
      verifyEmail: true,
      isCompleteUserDetails: true,
    });
  } catch (err: any) {
    console.error("Error updating user details:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
