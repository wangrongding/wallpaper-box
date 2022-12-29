interface Props {
  name: string;
  prefix?: string;
  color?: string;
  [key: string]: any;
}

export default function SvgIcon({
  name,
  prefix = "icon",
  color = "#333",
  ...props
}: Props) {
  const symbolId = `#${prefix}-${name}`;

  return (
    <svg {...props} aria-hidden="true">
      <use href={symbolId} fill={color} />
    </svg>
  );
}
