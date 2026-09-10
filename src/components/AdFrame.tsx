import type { LayoutNode, LayoutResult, Palette } from '../engine'

interface Props {
  layout: LayoutResult
  palette: Palette
  /** Longest edge the frame may occupy on screen. */
  maxSize: number
  /** Draws element boxes, the content box and the safe area. */
  debug?: boolean
}

export function AdFrame({ layout, palette, maxSize, debug = false }: Props) {
  const { surface, nodes } = layout
  const scale = Math.min(maxSize / surface.width, maxSize / surface.height, 1)
  const bleed = nodes.filter((node) => node.image?.bleed)
  const foreground = nodes.filter((node) => !node.image?.bleed)

  return (
    <div
      className="ad-frame"
      style={{ width: surface.width * scale, height: surface.height * scale }}
    >
      <div
        className="ad-frame__surface"
        style={{
          width: surface.width,
          height: surface.height,
          transform: `scale(${scale})`,
          background: palette.background,
          color: palette.foreground,
        }}
      >
        {bleed.map((node) => (
          <Node key={node.elementId} node={node} palette={palette} />
        ))}
        {bleed.length > 0 && <div className="ad-frame__scrim" />}
        {foreground.map((node) => (
          <Node key={node.elementId} node={node} palette={palette} />
        ))}
        {debug && <Debug layout={layout} />}
      </div>
    </div>
  )
}

function Node({ node, palette }: { node: LayoutNode; palette: Palette }) {
  const style: React.CSSProperties = {
    left: node.rect.x,
    top: node.rect.y,
    width: node.rect.width,
    height: node.rect.height,
  }

  if (node.image) {
    if (node.role === 'logo') {
      return (
        <div
          className="ad-node ad-node--logo"
          style={{
            ...style,
            background: palette.foreground,
            maskImage: `url(${node.image.src})`,
            WebkitMaskImage: `url(${node.image.src})`,
          }}
        />
      )
    }
    return (
      <img
        className="ad-node"
        style={{ ...style, objectPosition: `${node.image.position.x * 100}% ${node.image.position.y * 100}%` }}
        src={node.image.src}
        alt=""
      />
    )
  }

  if (!node.text) return null
  const { text } = node
  const isCta = node.role === 'cta'

  return (
    <div
      className={`ad-node ad-node--text${isCta ? ' ad-node--cta' : ''}`}
      style={{
        ...style,
        fontFamily: text.family,
        fontWeight: text.weight,
        fontSize: text.fontSize,
        lineHeight: text.lineHeight,
        letterSpacing: `${text.tracking}em`,
        textAlign: text.align,
        color: isCta ? palette.onAccent : node.role === 'legal' ? palette.muted : palette.foreground,
        background: isCta ? palette.accent : undefined,
        borderRadius: isCta ? node.rect.height / 2 : undefined,
      }}
    >
      {text.lines.map((line, i) => (
        <span key={i}>{line}</span>
      ))}
    </div>
  )
}

function Debug({ layout }: { layout: LayoutResult }) {
  const safe = layout.surface.safeArea
  return (
    <>
      <div
        className="ad-debug ad-debug--content"
        style={{
          left: layout.content.x,
          top: layout.content.y,
          width: layout.content.width,
          height: layout.content.height,
        }}
      />
      {safe && (
        <div
          className="ad-debug ad-debug--safe"
          style={{
            left: safe.left ?? 0,
            top: safe.top ?? 0,
            width: layout.surface.width - (safe.left ?? 0) - (safe.right ?? 0),
            height: layout.surface.height - (safe.top ?? 0) - (safe.bottom ?? 0),
          }}
        />
      )}
      {layout.nodes.map((node) => (
        <div
          key={`${node.elementId}-box`}
          className="ad-debug ad-debug--node"
          style={{ left: node.rect.x, top: node.rect.y, width: node.rect.width, height: node.rect.height }}
        />
      ))}
    </>
  )
}
