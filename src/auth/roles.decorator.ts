import { SetMetadata } from "@nestjs/common";

import { UserRole } from "../users/enums/UserRole";
import { CustomerRole } from "../customers/enums/CustomerRole";
import { ClientRole } from "../clients/enums/client-role.enum";

export const ROLES_KEY = "roles";

export const Roles = (...roles: Array<UserRole | CustomerRole | ClientRole>) => SetMetadata(ROLES_KEY, roles);
