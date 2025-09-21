import { Router } from "express";
import { NotesController } from "../controllers/NotesController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
const notesController = new NotesController();

// POST /api/notes - Create a new note (protected)
router.post("/", authenticateToken, (req, res) => {
  notesController.createNote(req, res);
});

// GET /api/notes - Get notes for authenticated user (protected)
router.get("/", authenticateToken, (req, res) => {
  notesController.getNotes(req, res);
});

// PUT /api/notes/:id - Update a note (protected)
router.put("/:id", authenticateToken, (req, res) => {
  notesController.updateNote(req, res);
});

// DELETE /api/notes/:id - Delete a note (protected)
router.delete("/:id", authenticateToken, (req, res) => {
  notesController.deleteNote(req, res);
});

// POST /api/notes/summary - Generate AI summary (public)
router.post("/summary", (req, res) => {
  notesController.generateSummary(req, res);
});

export default router;
