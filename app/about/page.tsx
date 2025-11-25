import Navbar from '../components/Navbar'
import ContactLinks from '../components/ContactLinks'
import './About.css'

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <article className="about-page">
        <div className="about-container reading-content">
          <section className="about-intro-section">
            <h1 className="about-title">Hello，我是新海</h1>
            <p className="about-intro">
              目前在北京，是一位非典型产品经理，同时对生活很是热爱，欢迎你来这里做客。
            </p>
          </section>

          <section className="about-section">
            <h2 className="about-section-title">我正在做的工作</h2>
            
            <div className="about-subsection">
              <h3 className="about-subsection-title">
                <span className="emoji">🚀</span> 我的产品理念
              </h3>
              <p>
                我坚信做有趣、有用的产品一定会帮助到更多人，这也是我做产品的意义。
              </p>
              <p>
                作为一名产品运营经理，我享受通过创造产品给用户带来价值和乐趣的过程。
              </p>
            </div>

            <div className="about-subsection">
              <h3 className="about-subsection-title">
                <span className="emoji">💼</span> 公司产品
              </h3>
              <div className="work-item">
                <p>
                  <span className="emoji">🎮</span> <strong>2019-2023年</strong>：负责休闲游戏与工具的出海领域，参与制作运营了 <strong>Brick n Ball</strong> 与 <strong>Zombie Waves</strong> 等知名游戏，它们累计被超过5000万用户下载，给全球玩家带来了无限乐趣。
                </p>
              </div>
              <div className="work-item">
                <p>
                  <span className="emoji">🎮</span> <strong>2023-近期</strong>：转向负责国内游戏领域，负责手机反恐特别行动、菜菜大冒险等手游国内运营，熟悉微信、抖音小程序生态，负责的游戏最好成绩进入iOS免费榜前十。
                </p>
              </div>
            </div>

            <div className="about-subsection">
              <h3 className="about-subsection-title">
                <span className="emoji">💡</span> 个人独立产品
              </h3>
              <div className="work-item">
                <p>
                  <strong>2017年</strong>：参与「你的日记」交换日记App立项、功能设计，上线后被爱范儿、少数派推荐，累计超过100w用户通过这个app记录日记、交换书信。
                </p>
              </div>
              <div className="work-item">
                <p>
                  <strong>2019-2021年</strong>：参与极简时钟App的功能需求、用户增长以及出海，服务超过500万用户。
                </p>
              </div>
              <div className="work-item">
                <p>
                  <strong>2021-2025年</strong>：参与负责 <strong>iTab 新标签页</strong>，服务用户从0到1→10w→100w→300w，目前是Edge、Chrome全球前三新标签页插件。
                </p>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2 className="about-section-title">我对生活的热爱</h2>
            
            <div className="about-subsection">
              <h3 className="about-subsection-title">
                <span className="emoji">💡</span> 我的生活理念
              </h3>
              <blockquote className="about-quote">
                "生活不止眼前的苟且，还有诗和远方的田野。"
              </blockquote>
            </div>

            <div className="about-subsection">
              <h3 className="about-subsection-title">
                <span className="emoji">🎨</span> 工作之外的我
              </h3>
              
              <div className="life-item">
                <p>
                  <span className="emoji">🍜</span> <strong>美食</strong>：我喜欢探索街边各种小吃，每周会探店一个从未吃过的餐厅，每周末会学着自己做一些想吃的美食。
                </p>
              </div>

              <div className="life-item">
                <p>
                  <span className="emoji">🗺️</span> <strong>探索身边</strong>：我喜欢用脚步和骑行的方式丈量我所在的城市，累计跑步超过2000km，骑行超过1000km。对我来说，探索城市就像玩一个开放世界游戏。每个季节我都会列出探索清单，并按节气时令把它们一一完成。
                </p>
              </div>

              <div className="life-item">
                <p>
                  <span className="emoji">📝</span> <strong>收集人间故事</strong>：我喜欢跟陌生人聊天，听听不同年龄的人间故事，并把它们记录到个人专辑《北京故事》中，目前已经记录到第97个，欢迎来和我一起交流。
                </p>
              </div>

              <div className="life-item">
                <p>
                  <span className="emoji">📚</span> <strong>读书</strong>：我最近在读《不要担心2小时和8公里以外的事情》。
                </p>
              </div>
            </div>
          </section>

          <section className="about-section about-contact-section">
            <h2 className="about-section-title">联系方式</h2>
            <ContactLinks layout="stacked" className="about-contact-links" />
          </section>
        </div>
      </article>
    </>
  )
}

