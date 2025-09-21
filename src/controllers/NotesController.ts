import { Request, Response } from "express";
import {
  NotesService,
  CreateNoteRequest,
  UpdateNoteRequest,
} from "../services/NotesService.js";
import { AIService } from "../services/AIService.js";

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

export class NotesController {
  private notesService: NotesService;
  private aiService: AIService;

  constructor() {
    this.notesService = new NotesService();
    this.aiService = new AIService();
  }

  async createNote(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, content, color, date } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      if (!content) {
        res.status(400).json({ error: "Content is required" });
        return;
      }

      const noteData: CreateNoteRequest = {
        title: title || "",
        content,
        color: color || "#10b981",
        date: date || new Date().toISOString(),
        user_id: userId,
      };

      const note = await this.notesService.createNote(noteData);

      res.status(201).json({
        message: "Note created successfully",
        note,
      });
    } catch (error) {
      console.error("Error creating note:", error);
      res.status(500).json({
        error: "Failed to create note",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getNotes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const notes = await this.notesService.getNotesByUserId(userId);

      res.status(200).json({ notes });
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({
        error: "Failed to fetch notes",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async updateNote(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: Partial<UpdateNoteRequest> = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      if (!id) {
        res.status(400).json({ error: "Note ID is required" });
        return;
      }

      // Verify note belongs to user
      const existingNote = await this.notesService.getNoteByIdAndUserId(
        id,
        userId
      );
      if (!existingNote) {
        res.status(404).json({ error: "Note not found" });
        return;
      }

      const note = await this.notesService.updateNote(id, updateData);

      res.status(200).json({
        message: "Note updated successfully",
        note,
      });
    } catch (error) {
      console.error("Error updating note:", error);
      res.status(500).json({
        error: "Failed to update note",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async deleteNote(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      if (!id) {
        res.status(400).json({ error: "Note ID is required" });
        return;
      }

      // Verify note belongs to user
      const existingNote = await this.notesService.getNoteByIdAndUserId(
        id,
        userId
      );
      if (!existingNote) {
        res.status(404).json({ error: "Note not found" });
        return;
      }

      await this.notesService.deleteNote(id);

      res.status(200).json({
        message: "Note deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({
        error: "Failed to delete note",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async generateSummary(req: Request, res: Response): Promise<void> {
    try {
      const { content } = req.body;

      if (!content) {
        res.status(400).json({ error: "Content is required" });
        return;
      }

      const summary = await this.aiService.generateNoteSummary(content);

      res.status(200).json({
        summary,
      });
    } catch (error) {
      console.error("Error generating summary:", error);
      res.status(500).json({
        error: "Failed to generate summary",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
