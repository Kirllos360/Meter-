import { ApiProperty } from '@nestjs/swagger';

class ActivityItem {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ format: 'date-time' })
  timestamp!: string;
}

export class RecentActivityDto {
  @ApiProperty({ type: [ActivityItem] })
  items!: ActivityItem[];
}
