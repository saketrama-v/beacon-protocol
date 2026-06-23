import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/clerk-sdk-node';
import prisma from '../../db/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    orgId: string;
  };
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing token' });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    // Cryptographically verify the JWT against Clerk's JWKS
    const decoded = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY
    });
    
    const clerkId = decoded.sub;

    // Check if this Clerk user already exists in our database
    let dbUser = await prisma.user.findUnique({
      where: { id: clerkId }
    });

    if (!dbUser) {
      // JIT Provisioning: This is a brand new user.
      // 1. Create a personal Organization for them.
      const org = await prisma.organization.create({
        data: {
          name: 'Personal Org',
          agents: {
            create: {
              name: 'Default Agent',
              framework: 'custom',
            }
          }
        }
      });

      // 2. Create the User mapped to this new Organization
      dbUser = await prisma.user.create({
        data: {
          id: clerkId,
          email: 'user_' + clerkId + '@clerk.local', // Clerk JWT might not contain email unless requested, so use fallback
          passwordHash: 'clerk_managed', // Required by older Prisma types until restarted
          orgId: org.id,
        }
      });
    }
    
    // We attach the Clerk user ID and their real orgId to the request.
    (req as any).user = { 
      id: dbUser.id,
      orgId: dbUser.orgId 
    };
    
    next();
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};
