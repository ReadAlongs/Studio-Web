import { FunctionalComponent, h } from "@stencil/core";

type MatProps = {
  outline?: boolean;
};

/**
 * Helper component to generate material icon output. It is also used
 * to identify which icons are used in the application to create smaller
 * font files for integration in offline HTML files.
 */
export const MatIcon: FunctionalComponent<MatProps> = (props, children) => {
  const iconType = props.outline ? "material-icons-outlined" : "material-icons";
  delete props.outline;

  return (
    <i class={iconType} {...props}>
      {children}
    </i>
  );
};
