import { User } from "src/users/entities/user.entity"

export type AuthResponse = {
	user: User;
	token: string;
}
