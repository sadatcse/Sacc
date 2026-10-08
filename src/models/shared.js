import mongoose from 'mongoose';

// Social / web links shared by every profile-like model
export const LinksSchema = new mongoose.Schema(
  {
    linkedin: { type: String, trim: true, default: '' },
    googleScholar: { type: String, trim: true, default: '' },
    researchGate: { type: String, trim: true, default: '' },
    ieee: { type: String, trim: true, default: '' }, // IEEE Xplore author page
    github: { type: String, trim: true, default: '' },
    facebook: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
  },
  { _id: false }
);

export const LINK_KEYS = ['linkedin', 'googleScholar', 'researchGate', 'ieee', 'github', 'facebook', 'website', 'email'];
