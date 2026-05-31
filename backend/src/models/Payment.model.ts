import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  loanId: mongoose.Types.ObjectId;
  recordedBy: mongoose.Types.ObjectId;
  utrNumber: string;
  amount: number;
  paymentDate: Date;
  outstandingAfter: number;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    loanId: { type: Schema.Types.ObjectId, ref: 'Loan', required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    utrNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    amount: { type: Number, required: true, min: 1 },
    paymentDate: { type: Date, required: true },
    outstandingAfter: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IPayment>('Payment', PaymentSchema);
