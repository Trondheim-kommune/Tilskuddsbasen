"""made only name mandatory for tilskuddsordning

Revision ID: 2185ea06cb24
Revises: 1003510641fb
Create Date: 2014-09-30 14:56:56.723488

"""

# revision identifiers, used by Alembic.
revision = '2185ea06cb24'
down_revision = '1003510641fb'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('tilskuddsordninger', 'budsjett',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.alter_column('tilskuddsordninger', 'soknadsfrist',
               existing_type=sa.DATE(),
               nullable=True)
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('tilskuddsordninger', 'soknadsfrist',
               existing_type=sa.DATE(),
               nullable=False)
    op.alter_column('tilskuddsordninger', 'budsjett',
               existing_type=sa.INTEGER(),
               nullable=False)
    ### end Alembic commands ###