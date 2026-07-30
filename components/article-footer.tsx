import Giscus from '@giscus/react';
import {
  IconBrandFacebook,
  IconBrandLinkedin,
  IconBrandTelegram,
  IconBrandX,
  IconEye,
  IconMail,
  IconThumbDown,
  IconThumbUp,
} from '@tabler/icons-react';
import { useLocalStorage } from '@uidotdev/usehooks';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useConfig, useTheme } from 'nextra-theme-docs';
import React from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  EmailShareButton,
  FacebookShareButton,
  LinkedinShareButton,
  TelegramShareButton,
  TwitterShareButton,
} from 'react-share';

import type { Post } from 'pages/api/logic';

// `label` feeds aria-label: these buttons hold nothing but an icon, so without
// it screen readers announce them as "button" and Lighthouse flags them.
const SHARE_BUTTONS = [
  { Button: FacebookShareButton, Icon: IconBrandFacebook, label: 'Facebook' },
  { Button: TwitterShareButton, Icon: IconBrandX, label: 'X (Twitter)' },
  { Button: TelegramShareButton, Icon: IconBrandTelegram, label: 'Telegram' },
  { Button: LinkedinShareButton, Icon: IconBrandLinkedin, label: 'LinkedIn' },
  { Button: EmailShareButton, Icon: IconMail, label: 'Email' },
] as const;

const Button: React.FC<
  {
    children: React.ReactNode;
    isActive: boolean;
  } & React.HTMLProps<HTMLButtonElement>
> = ({ children, isActive, ...props }) => (
  <button
    type={'button' as any}
    className={[
      'border-2 p-1 rounded hover:disabled:opacity-50 hover:disabled:cursor-not-allowed transition-all',
      isActive
        ? 'border-green-500 text-green-500'
        : 'border-black/40 dark:border-white/20',
    ].join(' ')}
    {...props}
  >
    {children}
  </button>
);

const ArticleFooter = () => {
  const { pathname } = useRouter();
  const path = encodeURI(pathname);
  const qk = useQueryClient();

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { theme } = useTheme();
  const { title } = useConfig();

  const [localStatus, setLocalStatus] = useLocalStorage<
    'liked' | 'disliked' | null
  >(path, null);

  const { data: post, isSuccess: postLoaded } = useQuery(['post', path], {
    queryFn: () => axios.post('/api/view', { path }),
    select: (data) => ({ ...data.data, views: data.data.views || 1 } as Post),
    refetchOnWindowFocus: false,
  });

  const like = useMutation([path], {
    mutationFn: () => axios.post('/api/like', { path }),
    onSuccess() {
      if (!post) return;
      qk.setQueryData(['post', path], {
        data: {
          ...post,
          likes: post.likes + 1,
          dislikes:
            localStatus == 'disliked' ? post.dislikes - 1 : post.dislikes,
        },
      });
      setLocalStatus('liked');
    },
  });

  const dislike = useMutation([path], {
    mutationFn: () => axios.post('/api/dislike', { path }),
    onSuccess() {
      if (!post) return;
      qk.setQueryData(['post', path], {
        data: {
          ...post,
          dislikes: post.dislikes + 1,
          likes: localStatus == 'liked' ? post.likes - 1 : post.likes,
        },
      });
      setLocalStatus('disliked');
    },
  });

  const buttonsDisabled =
    !postLoaded || like.isLoading || dislike.isLoading || localStatus != null;

  return (
    <>
      <div className="flex gap-2 mb-2 items-start">
        <div className="flex flex-col items-center w-8">
          <div className="p-1 border-2 border-transparent">
            <IconEye stroke={2} />
          </div>
          <span>{post?.views ?? 0}</span>
        </div>
        <div className="w-2" />
        <div className="flex flex-col items-center w-8">
          <Button
            aria-label="Maqolaga like bosish"
            isActive={localStatus == 'liked'}
            disabled={buttonsDisabled}
            onClick={() => like.mutateAsync()}
          >
            <IconThumbUp stroke={2} />
          </Button>
          <span>{post?.likes ?? 0}</span>
        </div>
        <div className="flex flex-col items-center w-8">
          <Button
            aria-label="Maqolaga dislike bosish"
            isActive={localStatus == 'disliked'}
            disabled={buttonsDisabled}
            onClick={() => dislike.mutateAsync()}
          >
            <IconThumbDown stroke={2} />
          </Button>
          <span>{post?.dislikes ?? 0}</span>
        </div>
        <div className="w-2" />
        {SHARE_BUTTONS.map(({ Button, Icon, label }) => (
          <Button
            aria-label={`${label}da ulashish`}
            url={window.location.href}
            className={[
              'w-9 h-9 flex items-center justify-center border-2 border-black/40 dark:border-white/20 p-1 rounded transition-all',
              'hover:border-green-500 hover:dark:border-green-500 hover:text-green-500',
            ].join(' ')}
            resetButtonStyle={false}
            title={title}
          >
            <Icon stroke={2} />
          </Button>
        ))}
      </div>
      <Giscus
        key={theme}
        id="comments"
        repo="ismoilovdevml/devops-journey"
        repoId="R_kgDOKEbY2g"
        category="General"
        categoryId="DIC_kwDOKEbY2s4Cczpf"
        mapping="pathname"
        term="Welcome to @giscus/react component!"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={
          (theme as any) == 'light' ? 'light_high_contrast' : 'noborder_dark'
        }
        lang="uz"
        loading="lazy"
      />
    </>
  );
};

export default ArticleFooter;
