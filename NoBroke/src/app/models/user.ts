export interface User {
  id: number;
  email: string;
  role: 'guest' | 'student' | 'employer';
  skills: string;
  github: string;
}
