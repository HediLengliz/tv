import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'f70727071588eb40c349a8bddbd2a3234b1a02731f67f27d4fbb9cb481cf5af2dd34a2b3077480c6a6e1aa3fc8d96d79bdae0d51879843ae6e59dea2d51309fa';

export function generateVerificationToken(userId: string): string {
    return jwt.sign(
        { userId, purpose: 'email-verification' },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}
// export function generateVerificationTokenPass(userId: string, purpose: string = 'email-verification'): string {
//     return jwt.sign(
//         { userId, purpose },
//         JWT_SECRET,
//         { expiresIn: '24h' }
//     );
// }

// export function verifyToken(token: string): any {
//     try {
//         return jwt.verify(token, JWT_SECRET);
//     } catch (error) {
//         return null;
//     }
// }
export function verifyToken(token: string) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        console.error("Token verification failed:", error);
        return null;
    }
}
