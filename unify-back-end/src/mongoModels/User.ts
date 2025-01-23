import mongoose, { Schema, Document } from 'mongoose';

interface user extends Document {
    name: string;
    email: string;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
});

const User = mongoose.model<user>('User', UserSchema);

export default User;
