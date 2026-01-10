import pool from '../utils/database';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  role_id: number;
  role_name?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class UserModel {
  static async findByUsername(username: string): Promise<User | null> {
    const [rows] = await pool.execute(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.username = ? AND u.is_active = TRUE`,
      [username]
    );
    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = ? AND u.is_active = TRUE`,
      [email]
    );
    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  }

  static async findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [id]
    );
    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  }

  static async create(userData: {
    username: string;
    email: string;
    password_hash: string;
    full_name: string;
    role_id: number;
  }): Promise<number> {
    const [result] = await pool.execute(
      `INSERT INTO users (username, email, password_hash, full_name, role_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        userData.username,
        userData.email,
        userData.password_hash,
        userData.full_name,
        userData.role_id,
      ]
    );
    return (result as any).insertId;
  }

  static async findAll(): Promise<User[]> {
    const [rows] = await pool.execute(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       ORDER BY u.created_at DESC`
    );
    return rows as User[];
  }

  static async update(
    id: number,
    updates: Partial<{
      username: string;
      email: string;
      full_name: string;
      role_id: number;
      is_active: boolean;
    }>
  ): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);
    await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return true;
  }

  static async getRoleId(roleName: string): Promise<number | null> {
    const [rows] = await pool.execute(
      'SELECT id FROM roles WHERE name = ?',
      [roleName]
    );
    const roles = rows as any[];
    return roles.length > 0 ? roles[0].id : null;
  }
}

