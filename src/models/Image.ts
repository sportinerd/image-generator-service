import mongoose, { Schema, Document } from 'mongoose';

export interface IImage extends Document {
    imageKey: string;
    url: string;
    type: string;
    metadata: {
        id: number;
        title: string;
        gw: string;
        caption?: string;
    };
    createdAt: Date;
}

const ImageSchema: Schema = new Schema({
    imageKey: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    url: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    metadata: {
        id: Number,
        title: String,
        gw: String,
        caption: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 2592000, // Auto-delete after 30 days (optional)
    },
});

export const Image = mongoose.model<IImage>('Image', ImageSchema);
