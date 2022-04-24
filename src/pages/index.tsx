import styles from './index.less';
import { history } from 'umi';

function createWallPaper() {
  // 跳转到指定路由
  history.push('/wallPaper');
}

export default function IndexPage() {
  return (
    <div>
      <h1 className={styles.title} onClick={createWallPaper}>
        Page index
      </h1>
    </div>
  );
}
