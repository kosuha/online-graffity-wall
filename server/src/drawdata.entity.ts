import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    OneToOne,
    JoinColumn,
  } from 'typeorm';

@Entity()
export class DrawData {
    @PrimaryGeneratedColumn()
    pk: number;
  
    @Column()
    id: string;

    @Column()
    width: number;
  
    @Column()
    color: string;
  
    @Column()
    from_x: number;

    @Column()
    from_y: number;

    @Column()
    to_x: number;

    @Column()
    to_y: number;
  }