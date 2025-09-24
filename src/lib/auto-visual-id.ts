'use server';

import { connectToDatabase } from '@/lib/mongodb';
import { type User, type VisualIdPromotionLog } from '@/lib/definitions';

/**
 * Checks if a user is eligible for a smart visual ID and sets it if they are.
 * This is triggered upon their first purchase of a "normal" (non-coin) product.
 * @param user The user object making the purchase.
 */
export async function setSmartVisualId(user: User): Promise<void> {
  // Rule: This feature only applies to users who do not already have a visual ID.
  if (user.visualGamingId) {
    return;
  }

  try {
    const db = await connectToDatabase();

    // Rule: Check if the user's ID has ever been part of a promotion (either as old or new ID).
    const existingPromotion = await db.collection<VisualIdPromotionLog>('visual_id_promotions').findOne({
      $or: [{ oldGamingId: user.gamingId }, { newGamingId: user.gamingId }],
    });

    if (existingPromotion) {
      return;
    }
    
    // Rule: Check if any other user currently has this ID as their visual ID.
    const isVisualIdForAnother = await db.collection<User>('users').findOne({
      visualGamingId: user.gamingId
    });

    if(isVisualIdForAnother) {
        return;
    }

    // All checks passed. The user is eligible.
    const smartId = generateSmartVisualId(user.gamingId);

    // Set the new visual ID for the user.
    await db.collection<User>('users').updateOne(
      { _id: user._id },
      { $set: { visualGamingId: smartId, visualIdSetAt: new Date() } }
    );
    
    console.log(`Smart Visual ID set for ${user.gamingId} -> ${smartId}`);

  } catch (error) {
    console.error('Error in setSmartVisualId:', error);
    // We don't throw an error because this is a background task and shouldn't fail the main purchase flow.
  }
}

/**
 * Generates a "smart" visual ID by changing one random digit of the original ID.
 * @param originalId The user's real gamingId.
 * @returns A new string with one digit randomly changed.
 */
function generateSmartVisualId(originalId: string): string {
  if (originalId.length === 0) {
    return '';
  }

  const idChars = originalId.split('');
  
  // 1. Select a random position in the ID to change.
  const randomIndex = Math.floor(Math.random() * idChars.length);
  const originalDigit = idChars[randomIndex];

  // 2. Generate a new random digit (0-9) that is different from the original.
  let newDigit: string;
  do {
    newDigit = String(Math.floor(Math.random() * 10));
  } while (newDigit === originalDigit);

  // 3. Replace the digit at the random position.
  idChars[randomIndex] = newDigit;

  return idChars.join('');
}
