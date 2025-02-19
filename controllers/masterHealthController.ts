import { Request, Response } from "express";
import MasterHealthModel from "../models/masterHealthModel";
export const createMasterHealth = async (req: Request, res: Response) => {
    try {
      const user = res.locals.user;
      const { tests } = req.body;
  
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      if (!tests || !Array.isArray(tests)) {
        return res.status(400).json({ message: "Invalid or missing tests data" });
      }
  
      const userId = user._id;
      let labReport = await MasterHealthModel.findOne({ userId });
  
      if (!labReport) {
        labReport = new MasterHealthModel({
          userId,
          tests,
        });
        await labReport.save();
        return res.status(200).json({ message: "New lab report created", report: labReport });
      }
  
      tests.forEach((newTest: any) => {
        const existingTest = labReport.tests.find(
          (test: any) => test.categories === newTest.categories
        );
  
        if (existingTest) {
          Object.entries(newTest.parameters).forEach(([key, value]) => {
            existingTest.parameters.set(key, value as number); 
          });
        } else {
          labReport.tests.push(newTest); 
        }
      });
  
      await labReport.save();
      return res.status(200).json({ message: "Lab report updated", report: labReport });
  
    } catch (error) {
      console.error("Error updating lab report:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
  

export const getMasterHealth = async (req: Request, res: Response) => {
  const user = res.locals.user;

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }
  const userId = user._id;
  const allMasterHealth = await MasterHealthModel.find({ userId });

  if (!allMasterHealth) {
    res.status(200).json({ message: "There is no Master Health is not Found" });
    return;
  }
  res
    .status(200)
    .json({ message: "Master Health data is Found", data: allMasterHealth });
};
