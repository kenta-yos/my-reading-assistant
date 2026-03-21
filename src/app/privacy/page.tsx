import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
}

export default function PrivacyPage() {
  return (
    <article className="prose prose-stone mx-auto max-w-2xl dark:prose-invert prose-headings:tracking-tight">
      <h1>プライバシーポリシー</h1>
      <p className="text-sm text-stone-500">最終更新日: 2026年3月21日</p>

      <p>
        読書アシスタントLuka（以下「本サービス」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。本ポリシーでは、本サービスが取得する情報とその取り扱いについて説明します。
      </p>

      <h2>1. 取得する情報</h2>
      <p>本サービスでは、Googleアカウントによるログイン時に以下の情報を取得します。</p>
      <ul>
        <li>氏名（表示名）</li>
        <li>メールアドレス</li>
        <li>プロフィール画像のURL</li>
      </ul>
      <p>これらはGoogleのOAuth 2.0認証を通じて、ユーザーの同意のもとに取得されます。</p>

      <h2>2. 利用目的</h2>
      <p>取得した情報は、以下の目的にのみ使用します。</p>
      <ul>
        <li>ユーザーの認証およびアカウント管理</li>
        <li>生成したガイドやブックマークの紐付け</li>
        <li>利用回数の管理</li>
        <li>サービスのアップデート、新機能のお知らせ、イベント案内などのメール送信</li>
      </ul>

      <h2>3. 第三者への提供</h2>
      <p>
        取得した個人情報を、ユーザーの同意なく第三者に提供・販売・共有することはありません。ただし、法令に基づく開示請求があった場合はこの限りではありません。
      </p>

      <h2>4. データの保管</h2>
      <ul>
        <li>ユーザー情報はPostgreSQLデータベース（Neon）に暗号化通信を通じて保管されます。</li>
        <li>生成されたガイドは作成から30日後に自動的に削除されます。</li>
        <li>パスワードは保存しません（Google認証のみ使用）。</li>
      </ul>

      <h2>5. データの削除</h2>
      <p>
        アカウントおよび関連データの削除を希望される場合は、下記の連絡先までご連絡ください。速やかにすべてのデータを削除いたします。
      </p>

      <h2>6. Cookieの使用</h2>
      <p>
        本サービスでは、認証状態の維持のためにセッションCookieを使用します。トラッキングや広告目的のCookieは使用しません。
      </p>

      <h2>7. 外部サービス</h2>
      <p>本サービスでは以下の外部サービスを利用しています。</p>
      <ul>
        <li>Google OAuth 2.0（認証）</li>
        <li>Google Gemini API（AIによるガイド生成）</li>
        <li>Google Books API / 国立国会図書館API / OpenBD API（書籍情報の検索）</li>
        <li>Vercel（ホスティング）</li>
        <li>Neon（データベース）</li>
      </ul>
      <p>各サービスのプライバシーポリシーについては、それぞれのサービス提供元をご確認ください。</p>

      <h2>8. 本ポリシーの変更</h2>
      <p>
        本ポリシーは、必要に応じて改定することがあります。重要な変更がある場合は、本サービス上で通知します。
      </p>

      <h2>9. お問い合わせ</h2>
      <p>
        プライバシーに関するお問い合わせは、
        <a href="https://bsky.app/profile/yomuhito21.bsky.social" target="_blank" rel="noopener noreferrer">
          @yomuhito21.bsky.social
        </a>
        までご連絡ください。
      </p>
    </article>
  )
}
