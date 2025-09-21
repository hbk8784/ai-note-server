import Note, { INote } from "../models/Note.js";
import mongoose from "mongoose";

export interface CreateNoteRequest {
  title: string;
  content: string;
  color: string;
  date: string;
  user_id: string;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  color?: string;
  date?: string;
}

export class NotesService {
  async createNote(noteData: CreateNoteRequest): Promise<INote> {
    try {
      const note = new Note({
        title: noteData.title,
        content: noteData.content,
        color: noteData.color,
        date: new Date(noteData.date),
        user: new mongoose.Types.ObjectId(noteData.user_id),
      });

      const savedNote = await note.save();
      return savedNote;
    } catch (error) {
      console.error("Error creating note:", error);
      throw new Error("Failed to create note");
    }
  }

  async getNotesByUserId(userId: string): Promise<INote[]> {
    try {
      const notes = await Note.find({ user: userId })
        .sort({ createdAt: -1 })
        .lean();

      return notes;
    } catch (error) {
      console.error("Error fetching notes:", error);
      throw new Error("Failed to fetch notes");
    }
  }

  async updateNote(
    noteId: string,
    updateData: Partial<UpdateNoteRequest>
  ): Promise<INote | null> {
    try {
      const note = await Note.findByIdAndUpdate(
        noteId,
        {
          ...updateData,
          ...(updateData.date && { date: new Date(updateData.date) }),
        },
        { new: true }
      );

      return note;
    } catch (error) {
      console.error("Error updating note:", error);
      throw new Error("Failed to update note");
    }
  }

  async deleteNote(noteId: string): Promise<void> {
    try {
      const result = await Note.findByIdAndDelete(noteId);
      if (!result) {
        throw new Error("Note not found");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      throw new Error("Failed to delete note");
    }
  }

  async getNoteById(noteId: string): Promise<INote | null> {
    try {
      const note = await Note.findById(noteId);
      return note;
    } catch (error) {
      console.error("Error fetching note:", error);
      throw new Error("Failed to fetch note");
    }
  }

  async getNoteByIdAndUserId(
    noteId: string,
    userId: string
  ): Promise<INote | null> {
    try {
      const note = await Note.findOne({
        _id: noteId,
        user: userId,
      });
      return note;
    } catch (error) {
      console.error("Error fetching note:", error);
      throw new Error("Failed to fetch note");
    }
  }
}
