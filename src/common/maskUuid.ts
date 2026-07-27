
/**
 * Converts UUID to six digits
 *
 * ```ts
 * const uuid = getOrderReference(uuid);
 * console.log(uuid);
 * => 440000
 * ```
 *
 * @param uuid
 * @returns
 */
export function getOrderReference(uuid: string): string {
    const clean = uuid.replace(/-/g, '');
    return clean.slice(-6);
}
