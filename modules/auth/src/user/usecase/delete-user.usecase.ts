import { UseCase } from "@sdd/shared";
import { UserNotFoundError } from "../error";
import { UserRepository } from "../provider";

export interface DeleteUserIn {
  id: string;
}

export class DeleteUser implements UseCase<DeleteUserIn, void> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: DeleteUserIn): Promise<void> {
    const user = await this.userRepository.findById(input.id);
    if (!user) {
      throw new UserNotFoundError();
    }

    await this.userRepository.delete(input.id);
  }
}
