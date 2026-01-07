export interface MemberCommentingData {
    disabled: boolean;
    disabled_reason: string | null;
    disabled_until: string | null;
}

export class MemberCommenting {
    readonly disabled: boolean;
    readonly disabledReason: string | null;
    readonly disabledUntil: Date | null;
    readonly canComment: boolean;

    private constructor(data: {
        disabled: boolean;
        disabledReason: string | null;
        disabledUntil: Date | null;
    }) {
        this.disabled = data.disabled;
        this.disabledReason = data.disabledReason;
        this.disabledUntil = data.disabledUntil;

        this.canComment = true;
        if (this.disabled) {
            this.canComment = this.disabledUntil ? this.disabledUntil <= new Date() : false;
        }
    }

    static parse(raw: string | null): MemberCommenting {
        if (!raw) {
            return MemberCommenting.enabled();
        }

        let data: MemberCommentingData;
        try {
            data = JSON.parse(raw);
        } catch {
            return MemberCommenting.enabled();
        }

        let disabledUntil: Date | null = null;
        if (data.disabled_until) {
            const parsedDate = new Date(data.disabled_until);
            if (isNaN(parsedDate.getTime())) {
                return MemberCommenting.enabled();
            }
            disabledUntil = parsedDate;
        }

        return new MemberCommenting({
            disabled: data.disabled,
            disabledReason: data.disabled_reason,
            disabledUntil
        });
    }

    static enabled(): MemberCommenting {
        return new MemberCommenting({
            disabled: false,
            disabledReason: null,
            disabledUntil: null
        });
    }

    static disabled(reason: string, until?: string | null): MemberCommenting {
        return new MemberCommenting({
            disabled: true,
            disabledReason: reason,
            disabledUntil: until ? new Date(until) : null
        });
    }

    enable(): MemberCommenting {
        return MemberCommenting.enabled();
    }

    disable(reason: string, until?: string | null): MemberCommenting {
        return MemberCommenting.disabled(reason, until);
    }

    format(): string {
        return JSON.stringify(this.serialize());
    }

    serialize(): MemberCommentingData {
        return {
            disabled: this.disabled,
            disabled_reason: this.disabledReason,
            disabled_until: this.disabledUntil?.toISOString() ?? null
        };
    }
}
