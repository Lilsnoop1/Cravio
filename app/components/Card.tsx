import type { CardProps } from "../Data/database";

const Card = ({ image, title }: CardProps) => {
  return (
    <div className="flex-[0_0_92%] md:flex-[0_0_100%] h-full px-[1.25px] min-w-0 md:px-2">
      <img
        src={image}
        alt={title}
        className="h-full w-full object-cover rounded-lg md:rounded-3xl"
      />
    </div>
  );
};

export default Card;
