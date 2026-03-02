import {
	User,
} from "src/users/entities/user.entity"

export type UserAuthResponse = {
	user: User;
	token: string;
}
