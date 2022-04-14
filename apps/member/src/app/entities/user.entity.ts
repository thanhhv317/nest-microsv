export class UserEntity {
    private readonly id: string;
    private readonly name: string;
    private readonly phone: string;

    constructor(payload) {
        this.id = payload._id || '';
        this.name = payload.name || '';
        this.phone = payload.phone || '';
    }
}