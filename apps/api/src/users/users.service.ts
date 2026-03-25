import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.toPublic(user);
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.full_name !== undefined && { full_name: dto.full_name }),
        ...(dto.profile_photo_url !== undefined && { profile_photo_url: dto.profile_photo_url }),
      },
    });
    return this.toPublic(user);
  }

  private toPublic(user: User) {
    return {
      id: user.id,
      phone_number: user.phone_number,
      full_name: user.full_name,
      profile_photo_url: user.profile_photo_url,
      status: user.status,
      created_at: user.created_at,
    };
  }
}
