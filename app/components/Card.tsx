import type { CardProps } from "../Data/database";

const Card = ({ image, title }: CardProps) => {
  return (
    <div className="flex-[0_0_100%] h-full">
      <img
        src={image}
        alt={title}
        className="h-full w-full object-cover rounded-3xl"
      />
    </div>
  );
};

export default Card;
