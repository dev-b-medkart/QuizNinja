import multer from "multer";

// Configure Multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadTeachersExcel = upload.single("file");
const uploadStudentsExcel = upload.single("file");

export { uploadTeachersExcel, uploadStudentsExcel };
