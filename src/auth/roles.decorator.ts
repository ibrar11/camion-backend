import { SetMetadata } from "@nestjs/common";

import { UserRole } from "../users/enums/UserRole";
import { CustomerRole } from "../customers/enums/CustomerRole";

export const ROLES_KEY = "roles";

export const Roles = (...roles: Array<UserRole | CustomerRole>) => SetMetadata(ROLES_KEY, roles);
