import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'borrower' | 'admin' | 'sales' | 'sanction' | 'disbursement' | 'collection';
export type EmploymentMode = 'salaried' | 'self_employed' | 'unemployed';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  pan?: string;
  dob?: Date;
  monthlySalary?: number;
  employmentMode?: EmploymentMode;
  personalDetailsSubmitted: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['borrower', 'admin', 'sales', 'sanction', 'disbursement', 'collection'],
      default: 'borrower',
    },
    pan: { type: String, uppercase: true, trim: true },
    dob: { type: Date },
    monthlySalary: { type: Number },
    employmentMode: {
      type: String,
      enum: ['salaried', 'self_employed', 'unemployed'],
    },
    personalDetailsSubmitted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model<IUser>('User', UserSchema);
