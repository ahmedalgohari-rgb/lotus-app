/**
 * Semantic Structure Components
 * WCAG 2.1 AA compliant semantic HTML structure for React Native
 */
import React from 'react';
import { View, ViewProps } from 'react-native';
import Text from '@/components/Text';
import { Typography } from '@/constants';

// ARIA landmark roles for React Native
export const LandmarkRoles = {
  banner: 'banner',
  navigation: 'navigation', 
  main: 'main',
  complementary: 'complementary',
  contentinfo: 'contentinfo',
  search: 'search',
  form: 'form',
  region: 'region',
} as const;

// Heading levels for proper hierarchy
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

interface SemanticViewProps extends ViewProps {
  role?: keyof typeof LandmarkRoles;
  label?: string;
  children: React.ReactNode;
}

/**
 * Semantic container with proper ARIA landmarks
 */
export const SemanticView: React.FC<SemanticViewProps> = ({
  role,
  label,
  children,
  ...props
}) => (
  <View
    {...(role && {
      accessibilityRole: role as any,
      accessibilityLabel: label,
    })}
    {...props}
  >
    {children}
  </View>
);

interface SemanticHeadingProps {
  level: HeadingLevel;
  children: string;
  style?: any;
  accessibilityLabel?: string;
}

/**
 * Semantic heading with proper hierarchy
 */
export const SemanticHeading: React.FC<SemanticHeadingProps> = ({
  level,
  children,
  style,
  accessibilityLabel,
}) => {
  const getHeadingStyle = () => {
    switch (level) {
      case 1:
        return Typography.screenTitle;
      case 2:
        return Typography.sectionHeader;
      case 3:
        return Typography.sectionHeader;
      case 4:
        return Typography.body;
      case 5:
        return Typography.bodySecondary;
      case 6:
        return Typography.caption;
      default:
        return Typography.body;
    }
  };

  return (
    <Text
      style={[getHeadingStyle(), style]}
      accessibilityRole="header"
      accessibilityLevel={level}
      accessibilityLabel={accessibilityLabel || children}
    >
      {children}
    </Text>
  );
};

interface SemanticListProps extends ViewProps {
  ordered?: boolean;
  children: React.ReactNode;
}

/**
 * Semantic list container
 */
export const SemanticList: React.FC<SemanticListProps> = ({
  ordered = false,
  children,
  ...props
}) => (
  <View
    accessibilityRole="list"
    {...props}
  >
    {children}
  </View>
);

interface SemanticListItemProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * Semantic list item
 */
export const SemanticListItem: React.FC<SemanticListItemProps> = ({
  children,
  ...props
}) => (
  <View
    accessibilityRole="listitem"
    {...props}
  >
    {children}
  </View>
);

interface SemanticArticleProps extends ViewProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Semantic article/content section
 */
export const SemanticArticle: React.FC<SemanticArticleProps> = ({
  title,
  children,
  ...props
}) => (
  <View
    accessibilityRole="article"
    accessibilityLabel={title}
    {...props}
  >
    {children}
  </View>
);

interface SemanticSectionProps extends ViewProps {
  title: string;
  headingLevel?: HeadingLevel;
  showHeading?: boolean;
  children: React.ReactNode;
}

/**
 * Semantic section with optional visible heading
 */
export const SemanticSection: React.FC<SemanticSectionProps> = ({
  title,
  headingLevel = 2,
  showHeading = true,
  children,
  ...props
}) => (
  <SemanticView
    role="region"
    label={title}
    {...props}
  >
    {showHeading && (
      <SemanticHeading level={headingLevel}>
        {title}
      </SemanticHeading>
    )}
    {children}
  </SemanticView>
);

interface SemanticNavigationProps extends ViewProps {
  label: string;
  children: React.ReactNode;
}

/**
 * Semantic navigation container
 */
export const SemanticNavigation: React.FC<SemanticNavigationProps> = ({
  label,
  children,
  ...props
}) => (
  <SemanticView
    role="navigation"
    label={label}
    {...props}
  >
    {children}
  </SemanticView>
);

interface SemanticMainProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * Main content area
 */
export const SemanticMain: React.FC<SemanticMainProps> = ({
  children,
  ...props
}) => (
  <SemanticView
    role="main"
    label="Main content"
    {...props}
  >
    {children}
  </SemanticView>
);

interface SemanticHeaderProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * Page/section header
 */
export const SemanticHeader: React.FC<SemanticHeaderProps> = ({
  children,
  ...props
}) => (
  <SemanticView
    role="banner"
    label="Page header"
    {...props}
  >
    {children}
  </SemanticView>
);

interface SemanticFooterProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * Page/section footer
 */
export const SemanticFooter: React.FC<SemanticFooterProps> = ({
  children,
  ...props
}) => (
  <SemanticView
    role="contentinfo"
    label="Page footer"
    {...props}
  >
    {children}
  </SemanticView>
);

// Predefined semantic layouts for common screen patterns
export const ScreenLayouts = {
  /**
   * Standard screen layout with header, main content, and navigation
   */
  Standard: ({ 
    title, 
    navigation, 
    children 
  }: { 
    title: string; 
    navigation?: React.ReactNode; 
    children: React.ReactNode; 
  }) => (
    <View style={{ flex: 1 }}>
      <SemanticHeader>
        <SemanticHeading level={1}>{title}</SemanticHeading>
        {navigation}
      </SemanticHeader>
      <SemanticMain>
        {children}
      </SemanticMain>
    </View>
  ),

  /**
   * Dashboard layout with sections
   */
  Dashboard: ({ 
    title, 
    sections 
  }: { 
    title: string; 
    sections: Array<{ title: string; content: React.ReactNode }>; 
  }) => (
    <View style={{ flex: 1 }}>
      <SemanticHeader>
        <SemanticHeading level={1}>{title}</SemanticHeading>
      </SemanticHeader>
      <SemanticMain>
        {sections.map((section, index) => (
          <SemanticSection 
            key={index}
            title={section.title}
            headingLevel={2}
          >
            {section.content}
          </SemanticSection>
        ))}
      </SemanticMain>
    </View>
  ),

  /**
   * List screen layout
   */
  List: ({
    title,
    items,
    renderItem,
    emptyState,
  }: {
    title: string;
    items: any[];
    renderItem: (item: any, index: number) => React.ReactNode;
    emptyState?: React.ReactNode;
  }) => (
    <View style={{ flex: 1 }}>
      <SemanticHeader>
        <SemanticHeading level={1}>{title}</SemanticHeading>
      </SemanticHeader>
      <SemanticMain>
        {items.length > 0 ? (
          <SemanticList>
            {items.map((item, index) => (
              <SemanticListItem key={index}>
                {renderItem(item, index)}
              </SemanticListItem>
            ))}
          </SemanticList>
        ) : (
          emptyState || <Text>No items found</Text>
        )}
      </SemanticMain>
    </View>
  ),

  /**
   * Form layout
   */
  Form: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={{ flex: 1 }}>
      <SemanticHeader>
        <SemanticHeading level={1}>{title}</SemanticHeading>
      </SemanticHeader>
      <SemanticMain>
        <SemanticView role="form" label={title}>
          {children}
        </SemanticView>
      </SemanticMain>
    </View>
  ),
};

/**
 * Hook for managing heading hierarchy context
 */
export const useHeadingHierarchy = () => {
  const [currentLevel, setCurrentLevel] = React.useState<HeadingLevel>(1);
  
  const getNextLevel = (): HeadingLevel => {
    return Math.min(currentLevel + 1, 6) as HeadingLevel;
  };
  
  const setLevel = (level: HeadingLevel) => {
    setCurrentLevel(level);
  };
  
  return {
    currentLevel,
    nextLevel: getNextLevel(),
    setLevel,
  };
};

/**
 * Screen reader announcements for dynamic content changes
 */
export const announceChange = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  // In React Native, this would use AccessibilityInfo.announceForAccessibility
  // For now, we'll use a placeholder
  console.log(`[${priority.toUpperCase()}] Screen reader: ${message}`);
};

export default {
  SemanticView,
  SemanticHeading,
  SemanticList,
  SemanticListItem,
  SemanticArticle,
  SemanticSection,
  SemanticNavigation,
  SemanticMain,
  SemanticHeader,
  SemanticFooter,
  ScreenLayouts,
  useHeadingHierarchy,
  announceChange,
};